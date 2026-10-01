import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuctionPanel } from "@/components/listings/AuctionPanel";
import { ListingImage } from "@/components/listings/ListingImage";
import { ListingOwnerActions } from "@/components/listings/ListingOwnerActions";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { VerifiedBadge } from "@/components/profile/VerifiedBadge";
import { Badge } from "@/components/ui/badge";
import { conversationId, getBids, getCurrentUser, getListingById } from "@/lib/api";
import { CATEGORIES, conditionLabel, listingTypeLabel, statusLabel } from "@/lib/constants";
import { formatListingPrice, formatRelativeTime } from "@/lib/utils";

/** Detail view for a single listing. */
export default async function ListingDetailPage({ params }: PageProps<"/listings/[id]">) {
  const { id } = await params;
  const [listing, user] = await Promise.all([getListingById(id), getCurrentUser()]);

  if (!listing) notFound();
  const bids = listing.auction ? await getBids(listing.id) : [];

  const category = CATEGORIES.find((item) => item.value === listing.category);
  const isOwner = user?.id === listing.seller.id;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to browse
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        <ListingImage
          src={listing.imageUrls[0]}
          alt={listing.title}
          className="aspect-[4/3] w-full rounded-xl border border-border"
        />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{listingTypeLabel(listing.listingType)}</Badge>
              {category ? <Badge variant="secondary">{category.label}</Badge> : null}
              <Badge variant="outline">{conditionLabel(listing.condition)}</Badge>
              {listing.status !== "active" ? (
                <Badge variant={listing.status === "reserved" ? "default" : "outline"}>
                  {statusLabel(listing.status)}
                </Badge>
              ) : null}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{listing.title}</h1>
            <p className="text-3xl font-semibold">{formatListingPrice(listing)}</p>
          </div>

          <p className="leading-relaxed text-foreground">{listing.description}</p>

          {listing.auction ? (
            <AuctionPanel listing={{ ...listing, auction: listing.auction }} bids={bids} userId={user?.id ?? null} />
          ) : null}

          {isOwner ? (
            <ListingOwnerActions
              listingId={listing.id}
              listingType={listing.listingType}
              status={listing.status}
            />
          ) : (
            // Signed-out visitors are sent to sign in first; the thread page needs a session.
            <Link
              href={user ? `/messages/${conversationId(listing.id, listing.seller.id)}` : "/login"}
              className="rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground hover:bg-primary/85"
            >
              {user ? "Message seller" : "Sign in to message the seller"}
            </Link>
          )}

          <div className="light-surface rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <UserAvatar name={listing.seller.name} src={listing.seller.avatarUrl} />
              <div className="flex flex-col">
                <Link
                  href={`/profile/${listing.seller.id}`}
                  className="flex items-center gap-1 font-medium hover:underline"
                >
                  {listing.seller.name}
                  <VerifiedBadge isVerified={listing.seller.isVerified} />
                </Link>
                <p className="text-xs text-muted-foreground">Posted {formatRelativeTime(listing.createdAt)}</p>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin aria-hidden="true" className="size-4" />
              Meet on campus. Exchange items in person.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

