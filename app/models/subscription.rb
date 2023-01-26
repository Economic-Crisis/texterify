class Subscription < ApplicationRecord
  belongs_to :organization

  validates :stripe_id, presence: true
  validates :stripe_created, presence: true
  validates :stripe_current_period_start, presence: true
  validates :stripe_current_period_end, presence: true
  validates :stripe_customer, presence: true
  validates :stripe_status, presence: true
  validates :stripe_start_date, presence: true
  validates :stripe_latest_invoice, presence: true
  validates :plan, presence: true
  validates :users_count, presence: true

  # https://stripe.com/docs/billing/subscriptions/overview#subscription-statuses
  enum stripe_status: {
         trialing: 'trialing',
         active: 'active',
         incomplete: 'incomplete',
         incomplete_expired: 'incomplete_expired',
         past_due: 'past_due',
         canceled: 'canceled',
         unpaid: 'unpaid'
       }

  def interrupt
    if Texterify.cloud? && !canceled
      self.canceled = true
      save!

      RestClient.put("#{ENV.fetch('PAYMENT_SERVICE_HOST')}/subscriptions/status?organization_id=#{organization.id}", {})
    end
  end

  def reactivate
    if Texterify.cloud? && canceled
      self.canceled = false
      save!

      RestClient.put("#{ENV.fetch('PAYMENT_SERVICE_HOST')}/subscriptions/status?organization_id=#{organization.id}", {})
    end
  end

  def change_plan(plan)
    if Texterify.cloud?
      if Plan.exists?(name: plan) && plan != 'trial'
        self.plan = plan
        self.canceled = false
        save!

        RestClient.put(
          "#{ENV.fetch('PAYMENT_SERVICE_HOST')}/subscriptions/plan?organization_id=#{organization.id}&plan=#{plan}",
          {}
        )
      else
        render json: { errors: [{ code: 'INVALID_PLAN' }] }, status: :bad_request
      end
    end
  end
end
