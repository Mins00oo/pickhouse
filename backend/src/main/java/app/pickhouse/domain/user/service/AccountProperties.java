package app.pickhouse.domain.user.service;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pickhouse.account")
public record AccountProperties(int gracePeriodDays) {}
