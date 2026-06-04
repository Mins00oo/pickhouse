package app.pickhouse.house.dto;

import app.pickhouse.domain.house.MaintenanceUtility;

import java.util.List;

/** maintenanceIncludes 의 JSON(List&lt;String&gt;) ↔ enum(List&lt;MaintenanceUtility&gt;) 변환 헬퍼. */
public final class MaintenanceCodes {

    private MaintenanceCodes() {}

    public static List<String> toStrings(List<MaintenanceUtility> values) {
        if (values == null) return null;
        return values.stream().map(Enum::name).toList();
    }

    public static List<MaintenanceUtility> toEnums(List<String> raw) {
        if (raw == null) return null;
        return raw.stream().map(MaintenanceUtility::valueOf).toList();
    }
}
