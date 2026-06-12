package app.homes.code.entity;

import app.homes.global.jpa.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 공통코드. PK = (grp_cd, cd). cd_name이 화면 표시용 한글 라벨.
 */
@Getter
@Entity
@Table(name = "cm_cd")
@IdClass(CmCdId.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CmCd extends BaseTimeEntity {

    @Id
    @Column(name = "grp_cd", length = 30)
    private String grpCd;

    @Id
    @Column(name = "cd", length = 30)
    private String cd;

    @Column(name = "cd_name", length = 100, nullable = false)
    private String cdName;

    @Column(name = "use_yn", length = 1, nullable = false)
    private String useYn;

    @Column(name = "sort_order")
    private Integer sortOrder;
}
