import * as AuthModels from "./models/auth.model";
import * as ImageModels from "./models/image.model";
import * as SubscriptionModels from "./models/subscription.model";
import * as TaskModels from "./models/task.model";

const {
  AccountTable,
  InvitationTable,
  MemberTable,
  OrganizationTable,
  PasskeyTable,
  SessionTable,
  UserTable,
  VerificationTable,
  TwoFactorTable,
  APIKeyTable,

  InvitationSchema: _InvitationSchema,
  OrganizationSchema: _OrganizationSchema,

  ...auth_rest
} = AuthModels;

const {
  SubscriptionTable,
  PaystackTransactionTable,
  PaystackCustomerTable,
  PaystackPaymentCredentialTable,
  PaystackPlanTable,
  PaystackProductTable,
  PaystackWebhookEventTable,
  ...subscription_rest
} = SubscriptionModels;

const { ImageTable, ...image_rest } = ImageModels;

const { TaskTable, TaskSchema: _TaskSchema, ...task_rest } = TaskModels;

export const schema = {
  // Auth
  user: UserTable,
  account: AccountTable,
  session: SessionTable,
  verification: VerificationTable,
  organization: OrganizationTable,
  member: MemberTable,
  invitation: InvitationTable,
  passkey: PasskeyTable,
  twoFactor: TwoFactorTable,
  apikey: APIKeyTable,
  ...auth_rest,

  // Subscription. These keys are the plugin's model names, not ours: the adapter
  // resolves a model as `schema[model]` and throws when it is absent. The old
  // `paystack_transaction` key never matched — the plugin has always called it
  // `paystackTransaction` — so `listTransactions` threw for as long as it existed.
  paystackSubscription: SubscriptionTable,
  paystackTransaction: PaystackTransactionTable,
  paystackCustomer: PaystackCustomerTable,
  paystackPaymentCredential: PaystackPaymentCredentialTable,
  paystackPlan: PaystackPlanTable,
  paystackProduct: PaystackProductTable,
  paystackWebhookEvent: PaystackWebhookEventTable,
  ...subscription_rest,

  // Image
  image: ImageTable,
  ...image_rest,

  // Task
  task: TaskTable,
  ...task_rest,
};
