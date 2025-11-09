import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LeadWithDetails, InsertActivity } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Mail, Phone, Building, Calendar, DollarSign, User, Plus, Loader2, MessageSquare, PhoneCall, Video, FileText } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function LeadDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [activityType, setActivityType] = useState("note");
  const [activitySubject, setActivitySubject] = useState("");
  const [activityNotes, setActivityNotes] = useState("");

  const { data: lead, isLoading } = useQuery<LeadWithDetails>({
    queryKey: ["/api/leads", id],
  });

  const addActivityMutation = useMutation({
    mutationFn: async (data: InsertActivity) => {
      const res = await apiRequest("POST", "/api/activities", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", id] });
      toast({
        title: "Activity added",
        description: "The activity has been logged successfully",
      });
      setActivityDialogOpen(false);
      setActivitySubject("");
      setActivityNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add activity",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddActivity = () => {
    if (!id || !activitySubject) return;
    
    addActivityMutation.mutate({
      leadId: parseInt(id),
      userId: 0,
      type: activityType,
      subject: activitySubject,
      notes: activityNotes || null,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h3 className="text-lg font-medium mb-2">Lead not found</h3>
        <Link href="/leads">
          <Button>Back to Leads</Button>
        </Link>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "won":
        return "default";
      case "lost":
        return "destructive";
      case "new":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call":
        return <PhoneCall className="h-4 w-4" />;
      case "meeting":
        return <Video className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "note":
        return <FileText className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/leads">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold" data-testid="text-lead-company">
            {lead.companyName}
          </h1>
          <p className="text-sm text-muted-foreground">{lead.contactName}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/leads/${id}/edit`}>
            <Button variant="outline" data-testid="button-edit-lead">
              Edit Lead
            </Button>
          </Link>
          <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-activity">
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Activity</DialogTitle>
                <DialogDescription>
                  Log an interaction or note for this lead
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="activity-type">Activity Type</Label>
                  <Select value={activityType} onValueChange={setActivityType}>
                    <SelectTrigger id="activity-type" data-testid="select-activity-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="call">Phone Call</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="activity-subject">Subject</Label>
                  <Input
                    id="activity-subject"
                    placeholder="Brief description"
                    value={activitySubject}
                    onChange={(e) => setActivitySubject(e.target.value)}
                    data-testid="input-activity-subject"
                  />
                </div>
                <div>
                  <Label htmlFor="activity-notes">Notes (Optional)</Label>
                  <Textarea
                    id="activity-notes"
                    placeholder="Additional details..."
                    value={activityNotes}
                    onChange={(e) => setActivityNotes(e.target.value)}
                    rows={4}
                    data-testid="textarea-activity-notes"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setActivityDialogOpen(false)}
                  data-testid="button-cancel-activity"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddActivity}
                  disabled={!activitySubject || addActivityMutation.isPending}
                  data-testid="button-save-activity"
                >
                  {addActivityMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Activity"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building className="h-4 w-4" />
                    <span>Company</span>
                  </div>
                  <p className="font-medium">{lead.companyName}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Contact</span>
                  </div>
                  <p className="font-medium">{lead.contactName}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </div>
                  <p className="font-medium">{lead.email}</p>
                </div>
                {lead.phone && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>Phone</span>
                    </div>
                    <p className="font-medium">{lead.phone}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Status</span>
                  </div>
                  <Badge variant={getStatusBadgeVariant(lead.status)}>
                    {getStatusLabel(lead.status)}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Source</span>
                  </div>
                  <p className="font-medium">{lead.source}</p>
                </div>
                {lead.value && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>Estimated Value</span>
                    </div>
                    <p className="font-medium">₹{lead.value.toLocaleString('en-IN')}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Created</span>
                  </div>
                  <p className="font-medium">
                    {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.activities && lead.activities.length > 0 ? (
                <div className="space-y-4">
                  {lead.activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4" data-testid={`activity-${activity.id}`}>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
                          {getActivityIcon(activity.type)}
                        </div>
                        {activity !== lead.activities[lead.activities.length - 1] && (
                          <div className="w-px h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <p className="font-medium text-sm">{activity.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.user.fullName} •{" "}
                              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {activity.type}
                          </Badge>
                        </div>
                        {activity.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{activity.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No activities yet. Add your first activity to start tracking interactions.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(lead.owner.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{lead.owner.fullName}</p>
                  <p className="text-sm text-muted-foreground">{lead.owner.email}</p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {lead.owner.role}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
