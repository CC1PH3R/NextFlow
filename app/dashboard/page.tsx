import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { caller } from "@/lib/trpc/server";

export default async function DashboardPage() {
  const health = await caller.dev.health();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-medium tracking-tight">
            Dashboard
          </h1>
          <Badge variant={health.ok ? "secondary" : "destructive"}>
            API {health.ok ? "ok" : "down"}
          </Badge>
        </div>
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
