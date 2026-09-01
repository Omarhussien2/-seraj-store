import { siteUrl } from "@/lib/seoContent";

export const SHIPPING_FEE_EGP = 40;
export const FREE_SHIPPING_MINIMUM_EGP = 500;
export const DELIVERY_ESTIMATE_BUSINESS_DAYS = { min: 5, max: 7 };
export const RETURN_WINDOW_DAYS = 14;
export const DEFECT_RETURN_WINDOW_DAYS = 30;
export const REFUND_PROCESSING_DAYS = 7;

export const merchantIdentity = {
  legalName: "عمر حسين جابر سيد",
  address: {
    "@type": "PostalAddress",
    streetAddress: "المعادي",
    addressLocality: "المعادي",
    addressRegion: "القاهرة",
    postalCode: "11311",
    addressCountry: "EG",
  },
};

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
  applicableCountry: "EG",
  returnPolicyCategory:
    "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: RETURN_WINDOW_DAYS,
  returnMethod: "https://schema.org/ReturnByMail",
  returnFees: "https://schema.org/FreeReturn",
  refundType: "https://schema.org/FullRefund",
  merchantReturnLink: siteUrl("/returns"),
};
