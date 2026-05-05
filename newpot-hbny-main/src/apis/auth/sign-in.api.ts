import api from "@/lib/api";
import { setToken } from "@/lib/auth-storage";

interface IRequest {
  email: string;
  password: string;
}

interface IResponse {
  message: string;
  accessToken: string;
}

export async function signInApi(payload: IRequest) {
  const response = await api.post<IResponse>("auth/sign-in", payload);
  if (response.data?.accessToken) {
    setToken(response.data.accessToken);
  }
  return response;
}
