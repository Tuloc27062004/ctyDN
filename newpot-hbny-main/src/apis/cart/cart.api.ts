import api from "@/lib/api";
import type {
  AddToCartPayload,
  CartItemResponseDto,
  CartResponseDto,
} from "@/types/cart.type";

export async function getCartApi(): Promise<CartResponseDto> {
  const response = await api.get<CartResponseDto>("/cart");
  return response.data;
}

export async function addToCartApi(
  payload: AddToCartPayload
): Promise<CartItemResponseDto> {
  const response = await api.post<CartItemResponseDto>("/cart", payload);
  return response.data;
}

export async function updateCartItemApi(
  cartItemId: string,
  payload: { quantity: number }
): Promise<CartItemResponseDto> {
  const response = await api.patch<CartItemResponseDto>(
    `/cart/${cartItemId}`,
    payload
  );
  return response.data;
}

export async function removeFromCartApi(cartItemId: string): Promise<void> {
  await api.delete(`/cart/${cartItemId}`);
}

export async function clearCartApi(): Promise<void> {
  await api.delete("/cart");
}
