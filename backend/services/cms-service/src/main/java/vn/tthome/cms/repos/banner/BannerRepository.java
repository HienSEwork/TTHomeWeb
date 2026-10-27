package vn.tthome.cms.repos.banner;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.cms.models.entities.Banner;

public interface BannerRepository extends JpaRepository<Banner, UUID>, BannerRepositoryCustom {

}
