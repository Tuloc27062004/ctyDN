import api from "@/lib/api";
import { IBasicUser } from "@/types/user.type";

interface IResponse {
  id: string;
  email: string;
  fullName: string;
  role: "USER" | "ADMIN";
  status: "PENDING" | "ACCEPTED" | "VERIFIED" | "REJECTED";
  country: string;
  companyName: string;
  companyAddress: string;
  phone: string;
  createdAt: Date;
}

function toUser(data: IResponse): IBasicUser {
  return {
    id: data.id,
    email: data.email,
    fullName: data.fullName,
    role: data.role,
  };
}

export async function authApi() {
  const res = await api.get<IResponse>("auth/me");

  return {
    ...res.data,
    toUser: () => toUser(res.data),
  };
}
