package app.pickhouse.user;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pickhouse.account")
public record AccountProperties(int gracePeriodDays) {}
