import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-medium tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Connected Next.js sites will show up here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sites</CardTitle>
          <CardDescription>
            No sites yet. Host status will appear after a repo is connected.
          </CardDescription>
          <CardAction>
            <Button variant="outline" disabled>
              Connect site
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Last publish</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody />
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
