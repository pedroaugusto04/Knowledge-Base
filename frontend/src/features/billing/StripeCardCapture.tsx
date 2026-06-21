import { forwardRef, useImperativeHandle, useMemo } from 'react';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe, type StripeCardElement } from '@stripe/stripe-js';

export type StripeCardCaptureHandle = {
  createPaymentMethodId: () => Promise<string>;
};

type StripeCardCaptureProps = {
  disabled?: boolean;
};

const cardElementOptions = {
  hidePostalCode: true,
  style: {
    base: {
      fontSize: '14px',
      color: 'var(--text-strong, #111827)',
      '::placeholder': {
        color: 'var(--muted, #6b7280)',
      },
    },
    invalid: {
      color: '#dc2626',
    },
  },
};

const StripeCardCaptureInner = forwardRef<StripeCardCaptureHandle, StripeCardCaptureProps>(
  function StripeCardCaptureInner({ disabled }, ref) {
    const stripe = useStripe();
    const elements = useElements();

    useImperativeHandle(ref, () => ({
      async createPaymentMethodId() {
        if (!stripe || !elements) {
          throw new Error('Stripe is still loading. Please try again.');
        }

        const cardElement = elements.getElement(CardElement) as StripeCardElement | null;
        if (!cardElement) {
          throw new Error('Card input is not ready.');
        }

        const { error, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
        });

        if (error) {
          throw new Error(error.message || 'Unable to validate card details.');
        }

        if (!paymentMethod?.id) {
          throw new Error('Unable to create payment method.');
        }

        return paymentMethod.id;
      },
    }), [elements, stripe]);

    return (
      <div className="form-field">
        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
          Card details
        </label>
        <div
          className="stripe-card-element"
          style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '12px',
            background: 'var(--surface-1, #fff)',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <CardElement options={cardElementOptions} />
        </div>
      </div>
    );
  },
);

type StripeCardCaptureProviderProps = StripeCardCaptureProps & {
  publishableKey: string;
};

export const StripeCardCapture = forwardRef<StripeCardCaptureHandle, StripeCardCaptureProviderProps>(
  function StripeCardCapture({ publishableKey, disabled }, ref) {
    const stripePromise = useMemo<Promise<Stripe | null>>(
      () => loadStripe(publishableKey),
      [publishableKey],
    );

    return (
      <Elements stripe={stripePromise}>
        <StripeCardCaptureInner ref={ref} disabled={disabled} />
      </Elements>
    );
  },
);
