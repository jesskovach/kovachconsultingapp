import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PaymentButton({ clientId, amount, description, type = "session", sessionId, size = "default", variant = "default", children }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);
      console.log('Starting payment with:', { clientId, amount, description, type, sessionId });
      
      const response = await base44.functions.invoke('createStripeCheckout', {
        clientId,
        amount,
        description,
        type,
        sessionId
      });

      console.log('Payment response:', response);

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else if (response.data?.error) {
        toast.error(response.data.error);
        setLoading(false);
      } else {
        toast.error('Failed to create checkout session');
        setLoading(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading}
      size={size}
      variant={variant}
      className={variant === "outline" ? "" : "bg-slate-800 hover:bg-slate-700"}
    >
      {children || (
        <>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CreditCard className="w-4 h-4 mr-2" />
          )}
          Pay ${amount}
        </>
      )}
    </Button>
  );
}