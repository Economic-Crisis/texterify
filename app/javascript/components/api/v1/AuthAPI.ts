import { authStore } from "../../stores/AuthStore";
import { API } from "./API";
import { APIUtils } from "./APIUtils";

export interface IAuthData {
    client: string;
    accessToken: string;
    uid: string;
}

export interface IUserProfile {
    id: string;
    email: string;
    provider: "email";
    username: string;
    uid: string;
    allow_password_change: boolean;
    is_superadmin: boolean;
}

export type ILoginResponse =
    | {
          data?: IUserProfile;
          errors?: any[];
      }
    | { error: true; error_type: "USER_IS_DEACTIVATED" };

const AuthAPI = {
    signup: async (username: string, email: string, password: string, passwordConfirmation: string): Promise<any> => {
        return API.postRequest("auth", false, {
            username: username,
            email: email,
            password: password,
            password_confirmation: passwordConfirmation
        });
    },

    login: async (email: string, password: string): Promise<ILoginResponse> => {
        return API.postRequest("auth/sign_in", false, null, {
            email: email,
            password: password
        });
    },

    logout: async (): Promise<any> => {
        await API.deleteRequest("auth/sign_out", true, null, null);
        authStore.resetAuth();
    },

    changePassword: async (
        currentPassword: string,
        newPassword: string,
        newPasswordConfirmation: string
    ): Promise<any> => {
        return API.putRequest("auth/password", true, {
            current_password: currentPassword,
            password: newPassword,
            password_confirmation: newPasswordConfirmation
        })
            .then(APIUtils.handleErrors)
            .catch(APIUtils.handleErrors);
    },

    setNewPassword: async (
        newPassword: string,
        newPasswordConfirmation: string,
        authData?: IAuthData
    ): Promise<any> => {
        return API.putRequest("auth/password", authData || true, {
            password: newPassword,
            password_confirmation: newPasswordConfirmation
        })
            .then(APIUtils.handleErrors)
            .catch(APIUtils.handleErrors);
    },

    sendPasswordRecoveryInstructions: async (email: string): Promise<any> => {
        return API.postRequest("auth/password", true, {
            email: email
        })
            .then(APIUtils.handleErrors)
            .catch(APIUtils.handleErrors);
    },

    resendConfirmationEmail: async (email: string) => {
        return API.postRequest("auth/confirmation", true, {
            email: email
        })
            .then(APIUtils.handleErrors)
            .catch(APIUtils.handleErrors);
    }
};

export { AuthAPI };
