import { guestEnabled } from "@/lib/guest";
import { LoginScreen } from "./login-screen";

export default function LoginPage() {
  return <LoginScreen guest={guestEnabled()} />;
}
