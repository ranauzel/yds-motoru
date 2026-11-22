import { createAuthClient } from "better-auth/react";

// Aynı adreste çalıştığı için baseURL gerekmez.
export const authClient = createAuthClient();
