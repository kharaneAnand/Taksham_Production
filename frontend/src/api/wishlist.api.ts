import type {
  WishlistApiResponse,
} from "../types/wishlist";

import { WISHLIST_API_URL } from "./serviceUrls";


interface AddWishlistItemPayload {
  productId: string;
}

const request = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  const result =
    (await response.json()) as {
      success?: boolean;
      message?: string;
      data?: T;
      errors?: unknown;
    };

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Wishlist request failed",
    );
  }

  return result.data as T;
};

export const getWishlist =
  async (): Promise<WishlistApiResponse> => {
    return request<WishlistApiResponse>(
      WISHLIST_API_URL,
      {
        method: "GET",
      },
    );
  };

export const addWishlistItem =
  async (
    payload: AddWishlistItemPayload,
  ): Promise<WishlistApiResponse> => {
    return request<WishlistApiResponse>(
      `${WISHLIST_API_URL}/items`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  };

export const removeWishlistItem =
  async (
    productId: string,
  ): Promise<WishlistApiResponse> => {
    return request<WishlistApiResponse>(
      `${WISHLIST_API_URL}/items/${encodeURIComponent(
        productId,
      )}`,
      {
        method: "DELETE",
      },
    );
  };

export const clearWishlist =
  async (): Promise<WishlistApiResponse> => {
    return request<WishlistApiResponse>(
      WISHLIST_API_URL,
      {
        method: "DELETE",
      },
    );
  };