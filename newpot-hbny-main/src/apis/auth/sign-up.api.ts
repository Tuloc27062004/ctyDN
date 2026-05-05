import api from "@/lib/api";

interface IRequest {
  fullName: string;
  email: string;
  phone: string;
  country: string | undefined;
  companyName: string | undefined;
  companyAddress: string | undefined;
  password: string;
}

interface IResponse {
  message: string;
}

export function signUpApi(payload: IRequest) {
  return api.post<IResponse>("auth/sign-up", payload);
}
