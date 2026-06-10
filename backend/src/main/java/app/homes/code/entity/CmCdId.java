package app.homes.code.entity;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * CmCd 복합키 (grp_cd, cd).
 */
@Getter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class CmCdId implements Serializable {

    private String grpCd;
    private String cd;
}
