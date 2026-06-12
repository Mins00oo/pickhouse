package app.homes.house.photo.repository;

import app.homes.house.photo.entity.Photo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PhotoRepository extends JpaRepository<Photo, Long> {

    // house.id 로 조회 (연관관계 경로 탐색)
    List<Photo> findByHouse_IdOrderBySortOrderAsc(Long houseId);
}
