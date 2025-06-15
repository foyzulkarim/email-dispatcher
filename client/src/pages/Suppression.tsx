
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Send, Trash2 } from "lucide-react";

// Mock data
const mockSuppressionEntries = [
  {
    id: "1",
    email: "bounced@example.com",
    reason: "bounce" as const,
    dateAdded: "2024-01-15",
    source: "automatic",
    notes: "Hard bounce - invalid email address",
  },
  {
    id: "2", 
    email: "complaint@example.com",
    reason: "complaint" as const,
    dateAdded: "2024-01-14",
    source: "feedback_loop",
    notes: "User marked as spam",
  },
  {
    id: "3",
    email: "unsubscribed@example.com",
    reason: "unsubscribe" as const,
    dateAdded: "2024-01-13",
    source: "user_request",
    notes: "Unsubscribed via email link",
  },
  {
    id: "4",
    email: "manual@example.com",
    reason: "manual" as const,
    dateAdded: "2024-01-12",
    source: "admin",
    notes: "Added manually by support team",
  },
  {
    id: "5",
    email: "another.bounce@test.com",
    reason: "bounce" as const,
    dateAdded: "2024-01-11",
    source: "automatic",
    notes: "Mailbox full",
  },
];

export default function Suppression() {
  const [searchTerm, setSearchTerm] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [entries, setEntries] = useState(mockSuppressionEntries);

  const addEntry = () => {
    if (!validateEmail(newEmail) || !newReason) return;
    
    const newEntry = {
      id: String(entries.length + 1),
      email: newEmail,
      reason: newReason as "bounce" | "complaint" | "manual" | "unsubscribe",
      dateAdded: new Date().toISOString().split('T')[0],
      source: "manual",
      notes: newNotes || undefined,
    };
    
    setEntries(prev => [newEntry, ...prev]);
    setNewEmail("");
    setNewReason("");
    setNewNotes("");
    setIsAddDialogOpen(false);
  };

  const removeEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const filteredEntries = entries.filter(entry =>
    entry.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const reasonOptions = [
    { value: "bounce", label: "Bounce" },
    { value: "complaint", label: "Complaint" },
    { value: "manual", label: "Manual" },
    { value: "unsubscribe", label: "Unsubscribe" },
  ];

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'bounce':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'complaint':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      case 'manual':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'unsubscribe':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const isFormValid = (): boolean => {
    return validateEmail(newEmail) && newReason.length > 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suppression List Management</h1>
          <p className="text-muted-foreground">Manage emails that should not receive campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Send className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm">
            <Send className="h-4 w-4 mr-2" />
            Export List
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Email
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Email to Suppression List</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@example.com"
                    className={newEmail && !validateEmail(newEmail) ? "border-red-500" : ""}
                  />
                  {newEmail && !validateEmail(newEmail) && (
                    <p className="text-sm text-red-600">Please enter a valid email address</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason *</Label>
                  <Select value={newReason} onValueChange={setNewReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {reasonOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Additional notes about this suppression"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={addEntry}
                    disabled={!isFormValid()}
                    className="flex-1"
                  >
                    Add Email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Suppression Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Suppressed Emails ({filteredEntries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email Address</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-sm">
                    {entry.email}
                  </TableCell>
                  <TableCell>
                    <Badge className={getReasonColor(entry.reason)}>
                      {entry.reason}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(entry.dateAdded).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{entry.source}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {entry.notes || '-'}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove from Suppression List</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove "{entry.email}" from the suppression list? 
                            This email will be able to receive campaigns again.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeEntry(entry.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredEntries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No emails found matching your search." : "No suppressed emails found."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Suppression Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {reasonOptions.map((reason) => {
              const count = entries.filter(entry => entry.reason === reason.value).length;
              return (
                <div key={reason.value} className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">{reason.label}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
