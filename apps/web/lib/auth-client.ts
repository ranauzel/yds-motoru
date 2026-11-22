import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Aynı adreste çalıştığı için baseURL gerekmez.
export const authClient = createAuthClient({ plugins: [anonymousClient()] });
