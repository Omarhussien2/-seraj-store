import { DELIVERY_ESTIMATE_BUSINESS_DAYS } from "@/lib/commercePolicies";

export const GOOGLE_CUSTOMER_REVIEWS_MERCHANT_ID = 5847247567;
export const GOOGLE_CUSTOMER_REVIEWS_DELIVERY_COUNTRY = "EG";

export interface GoogleCustomerReviewOrder {
  orderNumber: string;
  customerEmail: string;
  createdAt: Date;
}

export interface GoogleCustomerReviewOptIn {
  merchant_id: number;
  order_id: string;
  email: string;
  delivery_country: string;
  estimated_delivery_date: string;
}

export function addEgyptBusinessDays(startDate: Date, businessDays: number): Date {
  const result = new Date(startDate);
  result.setUTCHours(0, 0, 0, 0);

  let remaining = Math.max(0, Math.trunc(businessDays));
  while (remaining > 0) {
    // The purchase day is not a delivery day. Egypt's business week is
    // Sunday–Thursday, so Friday (5) and Saturday (6) are skipped.
    result.setUTCDate(result.getUTCDate() + 1);
    const day = result.getUTCDay();
    if (day !== 5 && day !== 6) remaining -= 1;
  }

  return result;
}

export function buildGoogleCustomerReviewOptIn(
  order: GoogleCustomerReviewOrder
): GoogleCustomerReviewOptIn {
  return {
    merchant_id: GOOGLE_CUSTOMER_REVIEWS_MERCHANT_ID,
    order_id: order.orderNumber,
    email: order.customerEmail,
    delivery_country: GOOGLE_CUSTOMER_REVIEWS_DELIVERY_COUNTRY,
    estimated_delivery_date: addEgyptBusinessDays(
      order.createdAt,
      DELIVERY_ESTIMATE_BUSINESS_DAYS.max
    )
      .toISOString()
      .slice(0, 10),
  };
}
