import { auth } from "$lib/auth/lucia";
import { get_user } from "$lib/auth/server";
import { error, json, type RequestHandler } from "@sveltejs/kit";

export const DELETE: RequestHandler = async ({ locals }) => {
  const { userId } = await get_user(locals);

  try {
    await auth.deleteUser(userId);

    return json({ ok: true });
  } catch (err) {
    console.log(err);
    error(
      500,
      "An error occurred while deleting the user. Please try again later.",
    );
  }
};
