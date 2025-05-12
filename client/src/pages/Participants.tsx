import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Participant } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Filter, User, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ParticipantForm from "@/components/participants/ParticipantForm";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ParticipantsProps {
  eventId: number;
}

export default function Participants({ eventId }: ParticipantsProps) {
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { data: participants, isLoading } = useQuery<Participant[]>({
    queryKey: [`/api/events/${eventId}/participants`],
    enabled: !!eventId,
  });

  // Filter participants based on search query and status filter
  const filteredParticipants = participants?.filter(participant => {
    // Apply search filter
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = participant.name.toLowerCase().includes(searchLower);
    const numberMatch = participant.number.toString().includes(searchLower);
    const matchesSearch = searchQuery === "" || nameMatch || numberMatch;
    
    // Apply status filter
    const matchesStatus = statusFilter === "all" || participant.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Count participants by status
  const activeCount = participants?.filter(p => p.status === "active").length || 0;
  const finishedCount = participants?.filter(p => p.status === "finished").length || 0;
  const withdrawnCount = participants?.filter(p => p.status === "withdrawn").length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-secondary">Active</Badge>;
      case "finished":
        return <Badge className="bg-primary">Finished</Badge>;
      case "withdrawn":
        return <Badge className="bg-accent">Withdrawn</Badge>;
      case "disqualified":
        return <Badge className="bg-destructive">Disqualified</Badge>;
      default:
        return <Badge className="bg-muted">Registered</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Participants</h1>
          <p className="text-muted-foreground">
            Manage participants for your event
          </p>
        </div>
        <Button onClick={() => setIsAddParticipantOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Participant
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div className="flex items-center w-full md:w-64">
              <Input
                placeholder="Search by name or bib #"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-background"
              />
              <Button variant="ghost" size="icon" className="ml-1">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="all" 
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="mt-4"
          >
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="all">
                All ({participants?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="active">
                <div className="flex items-center">
                  <span className="status-indicator status-active mr-1"></span>
                  Active ({activeCount})
                </div>
              </TabsTrigger>
              <TabsTrigger value="finished">
                <div className="flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-primary" />
                  Finished ({finishedCount})
                </div>
              </TabsTrigger>
              <TabsTrigger value="withdrawn">
                <div className="flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1 text-accent" />
                  Withdrawn ({withdrawnCount})
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter} className="mt-0">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="w-full h-12" />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Bib #</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Emergency Contact</TableHead>
                        <TableHead>Emergency Phone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredParticipants?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No participants found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredParticipants?.map((participant) => (
                          <TableRow key={participant.id}>
                            <TableCell className="font-mono text-center">{participant.number}</TableCell>
                            <TableCell className="font-medium flex items-center">
                              <User className="h-4 w-4 mr-2 text-muted-foreground" />
                              {participant.name}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(participant.status)}
                            </TableCell>
                            <TableCell>{participant.emergencyContact || "—"}</TableCell>
                            <TableCell className="font-mono">{participant.emergencyPhone || "—"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Participant Dialog */}
      <Dialog open={isAddParticipantOpen} onOpenChange={setIsAddParticipantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Participant</DialogTitle>
          </DialogHeader>
          <ParticipantForm 
            eventId={eventId}
            onSuccess={() => setIsAddParticipantOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
