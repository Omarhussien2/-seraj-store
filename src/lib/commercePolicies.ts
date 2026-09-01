import { siteUrl } from "@/lib/seoContent";

export const SHIPPING_FEE_EGP = 40;
export const FREE_SHIPPING_MINIMUM_EGP = 500;
export const DELIVERY_ESTIMATE_BUSINESS_DAYS = { min: 5, max: 7 };

export const SHIPPING_SERVICE_ID = siteUrl("/shipping#policy");
export const RETURN_POLICY_ID = siteUrl("/returns#policy");

const egyptDestination = {
  "@type": "DefinedRegion",
  addressCountry: "EG",
};

export const shippingService = {
  "@type": "ShippingService",
  "@id": SHIPPING_SERVICE_ID,
  name: "الشحن القياسي داخل مصر",
  description: `الشحن داخل مصر بقيمة ${SHIPPING_FEE_EGP} جنيه، ومجانًا للطلبات بقيمة ${FREE_SHIPPING_MINIMUM_EGP} جنيه أو أكثر.`,
  fulfillmentType: "https://schema.org/FulfillmentTypeDelivery",
  shippingConditions: [
    {
      "@type": "ShippingConditions",
      shippingDestination: egyptDestination,
      orderValue: {
        "@type": "MonetaryAmount",
        minValue: 0,
        maxValue: FREE_SHIPPING_MINIMUM_EGP - 0.01,
        currency: "EGP",
      },
      shippingRate: {
        "@type": "MonetaryAmount",
        value: SHIPPING_FEE_EGP,
        currency: "EGP",
      },
    },
    {
      "@type": "ShippingConditions",
      shippingDestination: egyptDestination,
      orderValue: {
        "@type": "MonetaryAmount",
        minValue: FREE_SHIPPING_MINIMUM_EGP,
        currency: "EGP",
      },
      shippingRate: {
        "@type": "MonetaryAmount",
        value: 0,
        currency: "EGP",
      },
    },
  ],
};

export const merchantReturnPolicy = {
  "@type": "MerchantReturnPolicy",
  "@id": RETURN_POLICY_ID,
  merchantReturnLink: siteUrl("/returns"),
};
