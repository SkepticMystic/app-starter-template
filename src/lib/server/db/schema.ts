import * as AuthModels from "./models/auth.model";
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

  InvitationSchema: _InvitationSchema,
  OrganizationSchema: _OrganizationSchema,

  ...auth_rest
} = AuthModels;

const { SubscriptionTable, PaystackTransactionTable, ...subscription_rest } =
  SubscriptionModels;

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
  ...auth_rest,

  // Subscription
  subscription: SubscriptionTable,
  paystack_transaction: PaystackTransactionTable,
  ...subscription_rest,

  // Task
  task: TaskTable,
  ...task_rest,
};
