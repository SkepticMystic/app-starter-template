import { defineRelations } from "drizzle-orm";
import { schema } from "./schema";

export const relations = defineRelations(schema, (r) => ({
	user: {
		accounts: r.many.account(),
		sessions: r.many.session(),
		members: r.many.member(),
		passkeys: r.many.passkey(),
		invitations: r.many.invitation(),
	},
	session: {
		user: r.one.user({
			from: r.session.userId,
			to: r.user.id,
		}),
		member: r.one.member({
			from: r.session.member_id,
			to: r.member.id,
		}),
		organization: r.one.organization({
			from: r.session.activeOrganizationId,
			to: r.organization.id,
		}),
	},
	account: {
		user: r.one.user({
			from: r.account.userId,
			to: r.user.id,
		}),
	},
	organization: {
		members: r.many.member(),
		invitations: r.many.invitation(),
	},
	member: {
		organization: r.one.organization({
			from: r.member.organizationId,
			to: r.organization.id,
			optional: false,
		}),
		user: r.one.user({
			from: r.member.userId,
			to: r.user.id,
			optional: false,
		}),
	},
	passkey: {
		user: r.one.user({
			from: r.passkey.userId,
			to: r.user.id,
		}),
	},
	invitation: {
		inviter: r.one.user({
			from: r.invitation.inviterId,
			to: r.user.id,
		}),
		organization: r.one.organization({
			from: r.invitation.organizationId,
			to: r.organization.id,
		}),
	},
	verification: {},
	twoFactor: {},
	task: {},
}));
