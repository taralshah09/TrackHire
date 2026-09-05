package com.projects.JobTracker_Backend.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

/**
 * Builds the {@link Pageable} for every paginated endpoint, with a hard ceiling
 * on {@code size}.
 *
 * <p>Without the cap, {@code ?size=100000} pulls the whole table in one request,
 * which is both the cheapest way to scrape the site and the easiest way to run
 * the Render instance out of heap. Requests above the ceiling are clamped rather
 * than rejected, so an over-eager client still gets a valid page back.
 */
@Component
public class PageRequestFactory {

    private final int maxSize;

    public PageRequestFactory(@Value("${app.pagination.max-size:50}") int maxSize) {
        this.maxSize = maxSize;
    }

    /** Clamped page request with the given sort, tie-broken on id for stable paging. */
    public Pageable of(int page, int size, String sortField, String direction) {
        Sort.Direction sortDirection = "ASC".equalsIgnoreCase(direction)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        return PageRequest.of(
                sanitizePage(page),
                sanitizeSize(size),
                Sort.by(sortDirection, sortField).and(Sort.by(Sort.Direction.DESC, "id"))
        );
    }

    /** Clamped page request with no sort applied. */
    public Pageable of(int page, int size) {
        return PageRequest.of(sanitizePage(page), sanitizeSize(size));
    }

    public int sanitizeSize(int size) {
        if (size < 1) {
            return 1;
        }
        return Math.min(size, maxSize);
    }

    public int sanitizePage(int page) {
        return Math.max(page, 0);
    }

    public int getMaxSize() {
        return maxSize;
    }
}
