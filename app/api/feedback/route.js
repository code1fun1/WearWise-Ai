export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import OutfitHistory from "@/models/OutfitHistory";
import ClothingItem from "@/models/ClothingItem";
import User from "@/models/User";
import { computePreferenceUpdate } from "@/lib/styleLearner";

/**
 * POST /api/feedback
 * Body: {
 *   historyId:             string   (OutfitHistory _id)
 *   selectedOutfitIndex:   number | null
 *   rejectedOutfitIndexes: number[]
 * }
 *
 * Flow:
 *  1. Update OutfitHistory record with selection / rejections
 *  2. Resolve clothing items for selected + rejected outfits
 *  3. Run style-learning engine → compute preference delta
 *  4. Update User.preferences in MongoDB
 *  5. Increment wearCount on selected outfit items
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
    }

    const { historyId, selectedOutfitIndex, rejectedOutfitIndexes } =
      await request.json();

    if (!historyId) {
      return NextResponse.json(
        { message: "historyId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // ── 1. Load history record ───────────────────────────────────
    const history = await OutfitHistory.findOne({
      _id: historyId,
      userId: session.user.id,
    });

    if (!history) {
      return NextResponse.json(
        { message: "Outfit history record not found" },
        { status: 404 }
      );
    }

    // Update feedback fields
    history.selectedOutfitIndex = selectedOutfitIndex ?? null;
    history.rejectedOutfitIndexes = rejectedOutfitIndexes ?? [];
    await history.save();

    // ── 2. Resolve clothing items ────────────────────────────────
    // Collect all item IDs across all generated outfits
    const allItemIds = history.generatedOutfits.flatMap((o) => o.items);
    const allItems = await ClothingItem.find({
      _id: { $in: allItemIds },
    }).lean();

    // Build a lookup map
    const itemMap = {};
    allItems.forEach((item) => {
      itemMap[item._id.toString()] = item;
    });

    // Items in the selected outfit
    const selectedItems =
      selectedOutfitIndex !== null &&
      selectedOutfitIndex !== undefined &&
      history.generatedOutfits[selectedOutfitIndex]
        ? history.generatedOutfits[selectedOutfitIndex].items.map(
            (id) => itemMap[id.toString()]
          ).filter(Boolean)
        : [];

    // Items in ALL rejected outfits (flat list)
    const rejectedItems = (rejectedOutfitIndexes ?? []).flatMap((idx) => {
      const outfit = history.generatedOutfits[idx];
      if (!outfit) return [];
      return outfit.items.map((id) => itemMap[id.toString()]).filter(Boolean);
    });

    // ── 3. Run style learning ────────────────────────────────────
    const user = await User.findById(session.user.id);
    const updatedPrefs = computePreferenceUpdate(
      user.preferences,
      selectedItems,
      rejectedItems
    );

    // ── 4. Persist updated preferences ──────────────────────────
    user.preferences = updatedPrefs;
    await user.save();

    // ── 5. Increment wearCount on selected items ─────────────────
    if (selectedItems.length) {
      const selectedIds = selectedItems.map((i) => i._id);
      await ClothingItem.updateMany(
        { _id: { $in: selectedIds } },
        {
          $inc: { wearCount: 1 },
          $set: { lastWorn: new Date() },
        }
      );
    }

    return NextResponse.json({
      message: "Feedback recorded. Style preferences updated.",
      preferences: updatedPrefs,
    });
  } catch (error) {
    console.error("[FEEDBACK ERROR]", error);
    return NextResponse.json(
      { message: "Failed to record feedback" },
      { status: 500 }
    );
  }
}
