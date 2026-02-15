import { PAYSTACK_SECRET_KEY } from "$env/static/private";
import { createPaystack } from "@alexasomba/paystack-node";

export const PaystackClient = createPaystack({
	secretKey: PAYSTACK_SECRET_KEY,
});
