package app.homes.code.repository;

import app.homes.code.entity.CmCd;
import app.homes.code.entity.CmCdId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CmCdRepository extends JpaRepository<CmCd, CmCdId> {

    List<CmCd> findByGrpCdAndUseYnOrderBySortOrderAsc(String grpCd, String useYn);
}
