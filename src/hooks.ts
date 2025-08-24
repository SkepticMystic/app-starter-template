import type { Transport } from "@sveltejs/kit";

export const transport: Transport = {
  ObjectId: {
    // NOTE: Best would be an instanceof ObjectId check, but a transporter gets imported into server and client
    // And we can't bring the mongo package to the client
    encode: (value) => value?._bsontype === "ObjectId" && value.toString(),
    decode: (sid) => sid, // Leave it as a string on the client
  },
};
