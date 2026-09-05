package com.projects.JobTracker_Backend.util;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import static org.junit.jupiter.api.Assertions.*;

class PageRequestFactoryTest {

    private final PageRequestFactory factory = new PageRequestFactory(50);

    @Test
    void clampsOversizedPageRequests() {
        // The whole point: ?size=100000 must not hand back the entire table.
        assertEquals(50, factory.of(0, 100_000, "postedAt", "DESC").getPageSize());
    }

    @Test
    void leavesReasonableSizesAlone() {
        assertEquals(20, factory.of(0, 20, "postedAt", "DESC").getPageSize());
    }

    @Test
    void forcesAtLeastOneRowPerPage() {
        assertEquals(1, factory.of(0, 0, "postedAt", "DESC").getPageSize());
        assertEquals(1, factory.of(0, -5, "postedAt", "DESC").getPageSize());
    }

    @Test
    void clampsNegativePageNumbers() {
        assertEquals(0, factory.of(-3, 20, "postedAt", "DESC").getPageNumber());
    }

    @Test
    void appliesRequestedSortAndTieBreaksOnId() {
        Pageable pageable = factory.of(0, 20, "postedAt", "ASC");
        Sort sort = pageable.getSort();

        assertEquals(Sort.Direction.ASC, sort.getOrderFor("postedAt").getDirection());
        assertEquals(Sort.Direction.DESC, sort.getOrderFor("id").getDirection());
    }

    @Test
    void defaultsToDescendingForAnythingButAsc() {
        assertEquals(Sort.Direction.DESC,
                factory.of(0, 20, "postedAt", "garbage").getSort().getOrderFor("postedAt").getDirection());
    }

    @Test
    void unsortedVariantIsAlsoClamped() {
        assertEquals(50, factory.of(0, 999).getPageSize());
    }
}
