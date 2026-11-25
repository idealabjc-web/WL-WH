import { supabase } from "../supabaseClient";

/**
 * Fetch gallery items for a given event, optionally filtered by category
 */
export async function fetchGalleryItems(eventSlug) {
  try {
    let query = supabase
      .from("gallery")
      .select("*")
      .order("created_at", { ascending: false });

    if (eventSlug) {
      query = query.eq("event_slug", eventSlug);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching gallery items:", error);
      return { success: false, error: error.message, data: [] };
    }
    return { success: true, data: data || [] };
  } catch (err) {
    console.error("Unexpected error in fetchGalleryItems:", err);
    return { success: false, error: err.message, data: [] };
  }
}

/**
 * Upload a single media file to Supabase storage bucket `conference-gallery`
 * and insert the record into `gallery` table.
 */
export async function uploadGalleryMedia({
  file,
  eventSlug = "dubai",
  category = "day1", // 'day1' | 'day2' | 'day3' | 'tour' | 'other'
  mediaType = "photo", // 'photo' | 'video'
  caption = "",
  userEmail = "",
  onProgress = null,
}) {
  try {
    // Generate safe unique storage path
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${eventSlug}/${category}/${timestamp}_${randomSuffix}_${cleanName}`;

    // 1. Upload to storage bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("conference-gallery")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // 2. Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from("conference-gallery")
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData?.publicUrl || "";

    // 3. Insert metadata row into `gallery` table
    const { data: insertData, error: insertError } = await supabase
      .from("gallery")
      .insert([
        {
          event_slug: eventSlug,
          category,
          media_type: mediaType,
          url: publicUrl,
          storage_path: storagePath,
          filename: file.name,
          caption: caption || file.name,
          file_size: file.size,
          uploaded_by: userEmail,
        },
      ])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return { success: true, data: insertData };
  } catch (err) {
    console.error("Failed to upload gallery media:", err);
    return { success: false, error: err.message || "Upload failed" };
  }
}

/**
 * Delete a media item from storage and database
 */
export async function deleteGalleryMedia(id, storagePath) {
  try {
    // 1. Delete from storage if storagePath exists
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from("conference-gallery")
        .remove([storagePath]);

      if (storageError) {
        console.warn("Storage deletion warning:", storageError.message);
      }
    }

    // 2. Delete database record
    const { error: dbError } = await supabase
      .from("gallery")
      .delete()
      .eq("id", id);

    if (dbError) throw dbError;

    return { success: true };
  } catch (err) {
    console.error("Error deleting gallery item:", err);
    return { success: false, error: err.message };
  }
}
