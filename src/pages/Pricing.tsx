
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { createCheckoutSession, createTopUp } from "@/services/subscription";
import { toast as sonnerToast } from "sonner";
import { PricingHeader } from "@/components/pricing/PricingHeader";
import { PlanCard } from "@/components/pricing/PlanCard";
import { TopUpSection } from "@/components/pricing/TopUpSection";

type Plan = Tables<"plans">;

const Pricing = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Check for payment success/cancelled url params
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const topUpStatus = searchParams.get("top_up");
    const credits = searchParams.get("credits");
    const planUpdated = searchParams.get("plan_updated");

    if (paymentStatus === "success") {
      sonnerToast.success("Payment successful", {
        description: "Your subscription has been activated"
      });
      setTimeout(() => navigate("/dashboard"), 1500);
    } else if (paymentStatus === "cancelled") {
      sonnerToast.error("Payment cancelled", {
        description: "Your subscription was not completed"
      });
    }

    if (topUpStatus === "success" && credits) {
      sonnerToast.success("Top-up successful", {
        description: `${credits} credits have been added to your account`
      });
      setTimeout(() => navigate("/dashboard"), 1500);
    } else if (topUpStatus === "cancelled") {
      sonnerToast.error("Top-up cancelled", {
        description: "Your credit purchase was not completed"
      });
    }
    
    if (planUpdated === "success") {
      sonnerToast.success("Plan updated successfully", {
        description: "Your free plan has been activated"
      });
      setTimeout(() => navigate("/dashboard"), 1500);
    }
  }, [searchParams, navigate]);

  // Fetch plans and user auth status
  useEffect(() => {
    const fetchPlansAndAuthStatus = async () => {
      try {
        const { data: plansData, error: plansError } = await supabase
          .from("plans")
          .select("*")
          .order("price", { ascending: true });

        if (plansError) throw plansError;
        setPlans(plansData || []);

        const { data } = await supabase.auth.getSession();
        setIsAuthenticated(!!data.session);

        if (data.session) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("plan, plan_id")
            .eq("id", data.session.user.id)
            .single();

          if (profileData) {
            setCurrentPlan(profileData.plan || "free");
          }
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error loading plans",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    fetchPlansAndAuthStatus();
  }, [toast]);

  const handleSelectPlan = async (planName: string, planId: string, isFree: boolean = false) => {
    if (!isAuthenticated) {
      sessionStorage.setItem("selectedPlan", planId);
      toast({
        title: "Authentication required",
        description: "Please sign in or create an account first"
      });
      navigate("/auth");
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await createCheckoutSession(planId);
      
      if (result?.isFree) {
        sonnerToast.success("Plan activated", {
          description: "Your free plan has been activated successfully"
        });
        setTimeout(() => navigate("/dashboard"), 1000);
      } else if (result && result.url) {
        window.location.href = result.url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error: any) {
      toast({
        title: "Error selecting plan",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async (amount: number, credits: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in or create an account first"
      });
      navigate("/auth");
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await createTopUp(amount, credits);
      
      if (result && result.url) {
        window.location.href = result.url;
      } else {
        throw new Error("Failed to create top-up session");
      }
    } catch (error: any) {
      toast({
        title: "Error creating top-up",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="container px-4 mx-auto">
        <PricingHeader 
          isAuthenticated={isAuthenticated}
          currentPlan={currentPlan}
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlan={currentPlan}
              loading={loading}
              onSelectPlan={handleSelectPlan}
            />
          ))}
        </div>
        
        <TopUpSection
          loading={loading}
          isAuthenticated={isAuthenticated}
          onTopUp={handleTopUp}
        />
      </div>
    </div>
  );
};

export default Pricing;
