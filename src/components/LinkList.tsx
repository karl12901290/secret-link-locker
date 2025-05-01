
import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, ExternalLink, Lock, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface Link {
  id: string;
  title: string;
  url: string;
  password: string | null;
  expiration_date: string | null;
  views: number;
  created_at: string;
}

interface LinkListProps {
  links: Link[];
  loading: boolean;
  onDelete: () => void;
}

// Memoize the component to prevent unnecessary re-renders
const LinkList = memo(({ links, loading, onDelete }: LinkListProps) => {
  const { toast } = useToast();
  
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("links")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      toast({
        title: "Link deleted",
        description: "The secure link has been removed."
      });
      
      onDelete();
    } catch (error: any) {
      toast({
        title: "Error deleting link",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const copyToClipboard = (id: string) => {
    const url = `${window.location.origin}/l/${id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Link copied to clipboard"
    });
  };
  
  const isExpired = (date: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };
  
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-2">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    );
  }
  
  if (links.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You haven't created any secure links yet.</p>
      </div>
    );
  }
  
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3">Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Views</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => (
            <TableRow key={link.id}>
              <TableCell className="font-medium">{link.title}</TableCell>
              <TableCell>
                <div className="flex space-x-1">
                  {link.password && (
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Lock className="h-3 w-3" />
                      <span>Password</span>
                    </Badge>
                  )}
                  {link.expiration_date && (
                    <Badge 
                      variant={isExpired(link.expiration_date) ? "destructive" : "outline"} 
                      className="flex items-center space-x-1"
                    >
                      <Clock className="h-3 w-3" />
                      <span>
                        {isExpired(link.expiration_date) 
                          ? "Expired" 
                          : `Expires ${format(new Date(link.expiration_date), "MMM d")}`
                        }
                      </span>
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{format(new Date(link.created_at), "MMM d, yyyy")}</TableCell>
              <TableCell>{link.views}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => copyToClipboard(link.id)}
                    title="Copy link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDelete(link.id)}
                    title="Delete link"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

export default LinkList;
