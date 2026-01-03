import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PaymentButton({ clientId, amount, description, type = "session", size = "default" }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('createStripeCheckout', {
        clientId,
        amount,
        description,
        type
      });

      console.log('Full Stripe response:', response);
      console.log('Response data:', response.data);
      console.log('Response URL:', response.data?.url);

      if (response.data?.url) {
        console.log('Redirecting to:', response.data.url);
        window.location.href = response.data.url;
      } else if (response.data?.error) {
        console.error('Stripe error:', response.data.error);
        toast.error(response.data.error);
      } else {
        console.error('Unexpected response format:', response);
        toast.error('Failed to create checkout session - check console');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading}
      size={size}
      className="bg-slate-800 hover:bg-slate-700"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <CreditCard className="w-4 h-4 mr-2" />
      )}
      Pay ${amount}
    </Button>
  );
}