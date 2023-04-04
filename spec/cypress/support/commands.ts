// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add("login", (email, password) => {
    cy.get('input[id="email"]').type(email);
    cy.get('input[id="password"]').type(password);
    cy.get("form").submit();
    cy.location("pathname").should("eq", "/dashboard/projects");
});

Cypress.Commands.add("signup", (username, email, password, passwordConfirmation, toggleTermsAndPrivacy) => {
    cy.focused().type(username);
    cy.get('[id="email"]').type(email);
    cy.get('[id="password"]').type(password);
    cy.get('[id="passwordConfirmation"]').type(passwordConfirmation);
    if (toggleTermsAndPrivacy) {
        cy.get('[id="agreeTermsOfServiceAndPrivacyPolicy"]').click();
    }
    cy.get('[data-id="sign-up-submit"]').click();
});

Cypress.Commands.add("createProject", (projectName, fromOrganizationPage) => {
    if (fromOrganizationPage) {
        cy.get('[data-id="organization-create-project"]').click();
    } else {
        cy.addOrganization("org-for-new-project");
        cy.get('[data-id="organization-create-project"]').click();
        // cy.get('[data-id="projects-create-project"]').click();
        // cy.get('[data-id="new-project-form-select-organization"]').click();
        // cy.contains("button", "Next").click();
    }

    cy.focused().type(projectName);
    cy.get('[data-id="new-project-form-create-project"]').click();

    if (fromOrganizationPage) {
        cy.location("pathname").should("contain", "/dashboard/organizations/");
        cy.location("pathname").should("contain", "/projects/");
    } else {
        cy.location("pathname").should("contain", "/dashboard/projects/");
    }
});

Cypress.Commands.add(
    "addLanguage",
    (data: {
        languageName: string;
        languageCode?: string;
        countryCode?: string;
        isDefault?: boolean;
        expectLimitReached?: boolean;
    }) => {
        cy.get('[title="Languages"] > a').click();
        cy.get(".ant-btn-default").click();

        if (data.expectLimitReached) {
            cy.get('[data-id="language-limit-reached-alert"]').should("exist");
            cy.get('[data-id="language-form-submit-button"]').should("be.disabled");
        } else {
            if (data.languageCode) {
                cy.contains("div", "Select a language").type(data.languageCode);
                cy.get("body").type("{enter}");
            }

            if (data.countryCode) {
                cy.contains("div", "Select a country").type(data.countryCode);
                cy.get("body").type("{enter}");
            }

            cy.get("#name").clear().type(data.languageName);
            if (data.isDefault) {
                cy.get("#is_default").click();
            }
            cy.get('[data-id="language-form-submit-button"]').click();
        }
    }
);

Cypress.Commands.add("addKey", (data: { name: string; description?: string; content?: string; isHtml?: boolean }) => {
    cy.get('[title="Keys"] > a').click();
    cy.get(".ant-btn-default").click();
    cy.get("#name").type(data.name);
    cy.get("#description").type(data.description);
    if (data.isHtml) {
        cy.get("#htmlEnabled").click();

        if (data.content) {
            cy.wait(1000); // wait until the editor has loaded
            cy.get(".ant-modal-body").find("div.ant-input").type(data.content);
            cy.wait(500); // wait until editor has saved content
        }
    } else if (data.content) {
        cy.get("#defaultLanguageContent").type(data.content);
    }
    cy.get('[data-id="key-form-submit-button"]').click();
});

Cypress.Commands.add("addUser", (userMail) => {
    cy.get('[title="Users"] > a').click();
    cy.get("#invite-user-open").click();
    cy.get("#inviteUser_email").type(userMail);
    cy.get("#invite-user-submit").click();
});

Cypress.Commands.add("addOrganization", (name) => {
    cy.get('[data-id="main-menu-organizations"]').click();
    cy.contains("button", "Create organization").click();
    cy.focused().type(name);
    cy.get('[data-id="new-organization-form-create-organization"]').click();
    cy.wait(500);
    cy.get('[data-id="main-menu-organizations"]').click();
    cy.contains(name).click();
    cy.location("pathname").should("contain", "/dashboard/organizations/");
});

Cypress.Commands.add("goToProject", (projectId: string) => {
    cy.get(`[data-id="project-${projectId}"]`).click();
});

Cypress.Commands.add("goToEditor", () => {
    cy.get('[data-id="project-sidebar-editor"]').click();
});

Cypress.Commands.add("leaveEditor", () => {
    cy.get(".editor-back").click();
});

Cypress.Commands.add("goToLanguages", () => {
    cy.get('[data-id="project-sidebar-languages"]').click();
});

Cypress.Commands.add("goToValidations", () => {
    cy.get('[data-id="project-sidebar-validations"]').click();
});

Cypress.Commands.add("goToForbiddenWords", () => {
    cy.get('[data-id="project-sidebar-validations"]').click();
    cy.get('[data-id="validations-sidebar-forbidden-words-lists"]').click();
});

Cypress.Commands.add("goToKeys", () => {
    cy.get('[data-id="project-sidebar-keys"]').click();
});

Cypress.Commands.add("goToProjectHome", () => {
    cy.get('[data-id="project-sidebar-home"]').click();
});

Cypress.Commands.add("goToProjectSettings", () => {
    cy.get('[data-id="project-sidebar-settings"]').click();
});

Cypress.Commands.add("checkIfKeyExists", (options: { key: string; description?: string; content?: string }) => {
    cy.goToKeys();
    cy.get('[data-id="editable-cell-content"]').contains(options.key);

    if (options.description) {
        cy.get('[data-id="editable-cell-content"]').contains(options.description);
    }

    if (options.content) {
        cy.get('[data-id="editable-cell-content"]').contains(options.content);
    }
});

Cypress.Commands.add(
    "importFile",
    (options: { fileName: string; fileFormat: string; languageName: string; searchFor: string }) => {
        cy.get('[data-id="project-sidebar-import"]').click();
        cy.get('[data-id="files-importer-files-uploader"]').selectFile(
            {
                contents: `cypress/fixtures/${options.fileName}`
            },
            { force: true }
        );
        cy.get('[data-id="files-importer-submit-button"]').click();
        cy.get(`[data-id="import-file-assigner-select-format"][data-import-name="${options.fileName}"]`).type(
            options.searchFor
        );
        cy.get(
            `[data-id="import-file-assigner-select-format-option-${options.fileFormat}"][data-import-name="${options.fileName}"]`
        ).click();
        cy.get("body").type("{enter}");
        cy.get(`[data-id="import-file-assigner-select-language"][data-import-name="${options.fileName}"]`).type(
            options.languageName
        );
        cy.get("body").type("{enter}");
        cy.get('[data-id="import-file-assigner-import-button"]').click();
        cy.get('[data-id="import-review-import-button"]', { timeout: 30000 }).click();
        cy.get('[data-id="import-review-import-button-confirm"]').click();
        cy.contains("Your import was successful", { timeout: 30000 }).should("exist");
    }
);

Cypress.Commands.add("clickOutside", () => {
    cy.get("body").click(0, 0);
    cy.wait(250);
});

Cypress.Commands.add("clickDataId", (id: string) => {
    cy.get(`[data-id="${id}"]`).click();
});

Cypress.Commands.add("selectKeyInEditor", (name: string) => {
    cy.get(".editor-key-name").contains(name).click(0, 0);
});

Cypress.Commands.add("featureNotAvailableInPlanShown", (id: string) => {
    cy.get(`[data-id="${id}"]`).should("contain", "Upgrade plan");
});

// Source: https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
Cypress.on("uncaught:exception", (err) => !err.message.includes("ResizeObserver loop limit exceeded"));
