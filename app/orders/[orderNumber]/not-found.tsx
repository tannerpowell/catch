import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchX, ArrowLeft, HelpCircle } from 'lucide-react';

export default function OrderNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to menu
        </Link>

        <Card className="border-[var(--color-border-subtle)]">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <SearchX className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl font-display">Order Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              We couldn&apos;t find an order with that number. This could mean:
            </p>
            <ul className="text-sm text-muted-foreground text-left max-w-sm mx-auto space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                The order number was entered incorrectly
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                The order is from a different location
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                The order was placed more than 30 days ago
              </li>
            </ul>

            <div className="pt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Order numbers look like: <code className="bg-muted px-2 py-1 rounded text-xs">ORD-20250123-ABC123</code>
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link href="/">Order Now</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/" className="gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Need Help?
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
