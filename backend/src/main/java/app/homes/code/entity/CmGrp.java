package app.homes.code.entity;

import app.homes.global.jpa.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 공통그룹코드 (예: HOUSE_DEAL_TYPE).
 */
@Getter
@Entity
@Table(name = "cm_grp")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CmGrp extends BaseTimeEntity {

    @Id
    @Column(name = "grp_cd", length = 30)
    private String grpCd;

    @Column(name = "grp_name", length = 100, nullable = false)
    private String grpName;

    @Column(name = "use_yn", length = 1, nullable = false)
    private String useYn;

    @Column(name = "sort_order")
    private Integer sortOrder;
}
