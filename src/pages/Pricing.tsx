
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, Bitcoin, Zap, ArrowLeft, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { createCheckoutSession, createTopUp } from "@/services/subscription";
import { toast as sonnerToast } from "sonner";

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
      // Redirect to dashboard after successful payment
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
      // Redirect to dashboard after successful top-up
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
      // Redirect to dashboard after plan update
      setTimeout(() => navigate("/dashboard"), 1500);
    }
  }, [searchParams, navigate]);

  // Fetch plans and user auth status
  useEffect(() => {
    const fetchPlansAndAuthStatus = async () => {
      try {
        // Get plans from the database
        const { data: plansData, error: plansError } = await supabase
          .from("plans")
          .select("*")
          .order("price", { ascending: true });

        if (plansError) throw plansError;
        setPlans(plansData || []);

        // Check auth status
        const { data } = await supabase.auth.getSession();
        setIsAuthenticated(!!data.session);

        // If authenticated, get current plan
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
      // Store the selected plan in session storage and redirect to auth
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
        // For free plans, show success message and redirect
        sonnerToast.success("Plan activated", {
          description: "Your free plan has been activated successfully"
        });
        setTimeout(() => navigate("/dashboard"), 1000);
      } else if (result && result.url) {
        // For paid plans, redirect to payment
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

  const renderFeatures = (featuresArray: any[]) => {
    return (
      <ul className="space-y-2">
        {featuresArray.map((feature, index) => (
          <li key={index} className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    );
  };

  // Helper function to highlight the free plan's link limit of 5
  const highlightExplorerLimit = (plan: Plan) => {
    if (plan.name === "Explorer" || plan.price === 0) {
      return (
        <div className="flex items-center">
          <Shield className="h-4 w-4 text-primary mr-2" />
          <span className="font-medium">Up to 5 links</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center">
        <Shield className="h-4 w-4 text-primary mr-2" />
        <span>
          {plan.links_limit === -1
            ? "Unlimited links"
            : `${plan.links_limit} links`}
        </span>
      </div>
    );
  };

  const renderFileUploadFeature = (plan: Plan) => {
    const hasFileUpload = plan.name !== "Explorer" && plan.price > 0;
    
    return (
      <div className="flex items-center">
        <Upload className="h-4 w-4 mr-2" style={{ color: hasFileUpload ? '#22c55e' : '#9ca3af' }} />
        <span className={hasFileUpload ? '' : 'text-gray-400 line-through'}>
          File uploads
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Select the plan that fits your needs. Pay with cryptocurrency.
          </p>
          <div className="flex items-center justify-center mt-4">
            <Bitcoin className="h-5 w-5 text-orange-500 mr-2" />
            <span className="text-sm">We accept cryptocurrency payments via Coinbase Commerce</span>
          </div>
          
          {isAuthenticated && currentPlan && (
            <div className="mt-4 flex justify-center">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-4 w-4" /> 
                Back to Dashboard
              </Button>
            </div>
          )}
          
          {!isAuthenticated && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <p className="text-yellow-700">
                You need an account to subscribe to a plan. 
                <Button 
                  variant="link" 
                  className="text-primary" 
                  onClick={() => navigate("/auth")}
                >
                  Sign in or create an account
                </Button>
              </p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`flex flex-col ${
                plan.name === "Power" 
                  ? "border-primary ring-2 ring-primary ring-opacity-50" 
                  : plan.name === "Explorer"
                  ? "border-amber-200" 
                  : ""
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {plan.name === "Power" && (
                    <Badge variant="secondary" className="ml-2">
                      Popular
                    </Badge>
                  )}
                  {plan.name === "Explorer" && (
                    <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                      Free
                    </Badge>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-6">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-sm text-gray-600">/month</span>
                </div>
                
                <div className="space-y-4">
                  {highlightExplorerLimit(plan)}
                  
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-primary mr-2" />
                    <span>
                      {plan.max_expiration_days === 1
                        ? "24 hour expiry"
                        : `${plan.max_expiration_days} day max expiry`}
                    </span>
                  </div>
                  
                  {renderFileUploadFeature(plan)}
                  
                  {plan.features && Array.isArray(plan.features) && renderFeatures(plan.features as string[])}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleSelectPlan(plan.name, plan.id, plan.price === 0)}
                  disabled={loading || currentPlan === plan.name}
                  className="w-full"
                  variant={plan.name === "Power" ? "default" : plan.name === "Explorer" ? "secondary" : "outline"}
                >
                  {currentPlan === plan.name
                    ? "Current Plan"
                    : loading
                    ? "Processing..."
                    : plan.price === 0 
                    ? "Select Free Plan"
                    : <>
                        <Bitcoin className="h-4 w-4 mr-2" /> 
                        Pay with Crypto
                      </>}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Need More?</h2>
          <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-primary mr-2" />
              <span className="text-lg font-medium">Top-Up Credits</span>
            </div>
            <p className="mb-4 text-gray-600">
              Need more links but don't want to upgrade? Buy additional credits anytime.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                className="flex flex-col" 
                onClick={() => handleTopUp(1, 20)}
                disabled={loading || !isAuthenticated}
              >
                <span className="text-lg font-bold">$1</span>
                <span className="text-xs">20 links</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col" 
                onClick={() => handleTopUp(3, 70)}
                disabled={loading || !isAuthenticated}
              >
                <span className="text-lg font-bold">$3</span>
                <span className="text-xs">70 links</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col" 
                onClick={() => handleTopUp(5, 120)}
                disabled={loading || !isAuthenticated}
              >
                <span className="text-lg font-bold">$5</span>
                <span className="text-xs">120 links</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
