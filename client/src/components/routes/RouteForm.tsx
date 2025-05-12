import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertRouteSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Route, MapPin, Delete } from "lucide-react";

// Extend the insertRouteSchema with additional validation
const formSchema = insertRouteSchema.extend({
  name: z.string().min(3, "Route name must be at least 3 characters"),
  distance: z.number().min(0.1, "Distance must be greater than 0"),
  path: z.any().refine(val => val !== null, {
    message: "Route path is required",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface RouteFormProps {
  onSuccess?: () => void;
}

export default function RouteForm({ onSuccess }: RouteFormProps) {
  const { toast } = useToast();
  const [checkpoints, setCheckpoints] = useState<{ name: string; lat: number; lng: number; order: number }[]>([]);
  
  // Sample GeoJSON path for demonstration
  const samplePath = {
    type: "LineString",
    coordinates: [
      [-122.4194, 37.7749],
      [-122.4101, 37.7853],
      [-122.4021, 37.7891],
      [-122.3957, 37.7915],
      [-122.3906, 37.7944],
    ]
  };

  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      distance: 0,
      path: samplePath,
      createdBy: 1, // Default to admin user
    },
  });

  // Create route mutation
  const createRoute = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiRequest("POST", "/api/routes", values);
      return res.json();
    },
    onSuccess: (data) => {
      // Create checkpoints if any
      if (checkpoints.length > 0) {
        checkpoints.forEach(async (checkpoint, index) => {
          try {
            await apiRequest("POST", "/api/checkpoints", {
              name: checkpoint.name,
              routeId: data.id,
              order: checkpoint.order,
              location: { 
                type: 'Point', 
                coordinates: [checkpoint.lng, checkpoint.lat] 
              },
              radius: 50,
            });
          } catch (error) {
            console.error(`Failed to create checkpoint ${index}:`, error);
          }
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      toast({
        title: "Route created successfully",
        description: "Your new route has been created",
      });
      onSuccess?.();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create route",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add checkpoint to list
  const addCheckpoint = () => {
    setCheckpoints([
      ...checkpoints,
      { 
        name: `CP${checkpoints.length + 1}`, 
        lat: 37.7749 + (Math.random() * 0.01), 
        lng: -122.4194 + (Math.random() * 0.01),
        order: checkpoints.length
      }
    ]);
  };

  // Remove checkpoint from list
  const removeCheckpoint = (index: number) => {
    setCheckpoints(checkpoints.filter((_, i) => i !== index));
  };

  // Form submission handler
  const onSubmit = (values: FormValues) => {
    createRoute.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Route Name</FormLabel>
              <FormControl>
                <Input placeholder="Mountain Challenge Route" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A challenging mountain bike route with steep climbs and descents"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="distance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Distance (km)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.1"
                  placeholder="21.5"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* This would normally be a map component for drawing routes */}
        <div className="space-y-2">
          <FormLabel>Route Path</FormLabel>
          <Card>
            <CardContent className="p-4 flex items-center justify-center">
              <div className="text-center p-4">
                <Route className="h-12 w-12 text-primary mx-auto mb-2" />
                <p className="text-muted-foreground mb-2">
                  In a complete implementation, this would be an interactive map
                  for drawing and editing the route path.
                </p>
                <p className="text-xs text-muted-foreground">
                  A sample route has been provided for demonstration purposes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Checkpoints Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <FormLabel>Checkpoints</FormLabel>
            <Button type="button" variant="outline" size="sm" onClick={addCheckpoint}>
              Add Checkpoint
            </Button>
          </div>
          
          {checkpoints.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              No checkpoints defined. Add checkpoints to mark important locations on your route.
            </p>
          ) : (
            <div className="space-y-2">
              {checkpoints.map((checkpoint, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input 
                    value={checkpoint.name}
                    onChange={(e) => {
                      const updated = [...checkpoints];
                      updated[index].name = e.target.value;
                      setCheckpoints(updated);
                    }}
                    className="flex-grow"
                  />
                  <div className="flex items-center bg-muted px-2 py-1 rounded text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>
                      {checkpoint.lat.toFixed(5)}, {checkpoint.lng.toFixed(5)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCheckpoint(index)}
                  >
                    <Delete className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess?.()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createRoute.isPending}
          >
            {createRoute.isPending ? "Creating..." : "Create Route"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
