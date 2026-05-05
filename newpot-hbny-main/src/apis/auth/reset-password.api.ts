import api from "@/lib/api";

interface IRequest {
  email: string;
  password: string;
  token: string;
}

interface IResponse {
  message: string;
}


export async function resetPasswordApi({ email, password, token }: IRequest) {
  const response = await api.post<IResponse>("auth/reset-password", { email, password }, {params: { token }});
  return response;
}

export async function requestPasswordResetApi(email: string) {
  const response = await api.post<IResponse>("auth/request-password-reset", { email });
  return response;
}
