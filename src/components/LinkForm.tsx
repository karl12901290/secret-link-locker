import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const LinkForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!url) {
      toast({
        title: "URL is required",
        description: "Please enter a URL to create a secure link",
        variant: "destructive",
      });
      return;
    }

    if (!title) {
      toast({
        title: "Title is required",
        description: "Please enter a title for your link",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      // Check user plan first to ensure they have not reached their limit
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
          links_created,
          plans:plan_id (
            links_limit
          )
        `)
        .eq("id", (await supabase.auth.getUser()).data.user?.id || '')
        .single();
      
      if (profileError) throw profileError;
      
      // Check if user has reached their limit
      if (profileData.plans && 
          profileData.plans.links_limit >= 0 && 
          profileData.links_created >= profileData.plans.links_limit) {
        toast({
          title: "Plan limit reached",
          description: "You have reached your plan's link limit. Please upgrade your plan or purchase additional credits.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // If user has credits, they can create links even if they've reached their plan limit
      const { data: userData } = await supabase
        .from("profiles")
        .select("credits_balance")
        .eq("id", (await supabase.auth.getUser()).data.user?.id || '')
        .single();
        
      // If user has reached their plan limit but has credits, use a credit
      let useCredit = false;
      if (profileData.plans && 
          profileData.plans.links_limit >= 0 && 
          profileData.links_created >= profileData.plans.links_limit && 
          userData && userData.credits_balance > 0) {
        useCredit = true;
      }
      
      // Insert the new link
      const { data, error } = await supabase.from("links").insert([
        {
          url,
          title,
          password: password || null,
          expiration_date: expirationDate?.toISOString() || null,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        },
      ]);

      if (error) throw error;
      
      // If using a credit, decrement the credit balance
      if (useCredit) {
        const { error: creditError } = await supabase
          .from("profiles")
          .update({ credits_balance: userData.credits_balance - 1 })
          .eq("id", (await supabase.auth.getUser()).data.user?.id || '');
          
        if (creditError) {
          console.error("Error updating credit balance:", creditError);
          // Continue even if credit update fails, as link was created
        }
      }

      toast({
        title: "Link created",
        description: "Your secure link has been created successfully",
      });
      
      setUrl("");
      setTitle("");
      setPassword("");
      setExpirationDate(null);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error creating link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div>
        <Label htmlFor="url">URL</Label>
        <Input
          type="url"
          id="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          type="text"
          id="title"
          placeholder="My Secure Link"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="password">Password (optional)</Label>
        <Input
          type="password"
          id="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <Label>Expiration Date (optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !expirationDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {expirationDate ? format(expirationDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={expirationDate}
              onSelect={setExpirationDate}
              disabled={(date) =>
                date < new Date()
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Link"}
      </Button>
    </form>
  );
};

export default LinkForm;
