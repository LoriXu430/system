import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      phone: string;
      role: "owner" | "manager" | "receptionist" | "technician" | "customer";
      storeId: string;
    } & DefaultSession["user"];
  }

  interface User {
    phone: string;
    role: string;
    storeId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    phone: string;
    role: string;
    storeId: string | null;
  }
}
