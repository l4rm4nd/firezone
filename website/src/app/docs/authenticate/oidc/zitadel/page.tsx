import Content from "./readme.mdx";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zitadel OIDC • Firezone Docs",
  description:
    "Enforce 2FA/MFA for users of Firezone's WireGuard®-based secure access platform. This guide walks through integrating Zitadel for single sign-on using OpenID Connect (OIDC).",
};

export default function Page() {
  return <Content />;
}
