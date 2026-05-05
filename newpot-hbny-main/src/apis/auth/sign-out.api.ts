import api from "@/lib/api";
import { clearToken } from "@/lib/auth-storage";

interface IResponse {
  message: string;
}

export async function signOutApi() {
  try {
    const res = await api.post<IResponse>("auth/sign-out");
    return res.data;
  } finally {
    clearToken();
  }
}
