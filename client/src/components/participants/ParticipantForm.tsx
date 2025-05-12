import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertParticipantSchema } from "@shared/schema";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Extend the insertParticipantSchema with additional validation
const formSchema = insertParticipantSchema.extend({
  name: z.string().min(3, "Name must be at least 3 characters"),
  number: z.number().min(1, "Bib number must be at least 1"),
  status: z.enum(["registered", "active", "finished", "withdrawn", "disqualified"], {
    required_error: "Please select a status",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface ParticipantFormProps {
  eventId: number;
  onSuccess?: () => void;
}

export default function ParticipantForm({ eventId, onSuccess }: ParticipantFormProps) {
  const { toast } = useToast();

  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      number: 0,
      eventId: eventId,
      status: "registered",
      emergencyContact: "",
      emergencyPhone: "",
    },
  });

  // Create participant mutation
  const createParticipant = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiRequest("POST", "/api/participants", values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/participants`] });
      toast({
        title: "Participant added successfully",
        description: "The participant has been added to the event",
      });
      onSuccess?.();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to add participant",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: FormValues) => {
    // Ensure eventId is set
    values.eventId = eventId;
    createParticipant.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bib Number</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={1}
                  placeholder="42"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="registered">Registered</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  <SelectItem value="disqualified">Disqualified</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="emergencyContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency Contact</FormLabel>
                <FormControl>
                  <Input placeholder="Contact Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="emergencyPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency Phone</FormLabel>
                <FormControl>
                  <Input placeholder="123-456-7890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
            disabled={createParticipant.isPending}
          >
            {createParticipant.isPending ? "Adding..." : "Add Participant"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
