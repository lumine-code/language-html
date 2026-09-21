describe("HTML injection lifecycle", () => {
  it("removes package-owned injection points on deactivation", async () => {
    if (lumine.packages.getPackageLifecycleState("language-html") === "active") {
      await lumine.packages.deactivatePackage("language-html");
    }

    const registrations = [];
    spyOn(lumine.grammars, "addInjectionPoint").and.callFake(() => {
      const registration = { dispose: jasmine.createSpy("dispose") };
      registrations.push(registration);
      return registration;
    });

    await lumine.packages.activatePackage("language-html");
    expect(registrations.length).toBe(6);

    await lumine.packages.deactivatePackage("language-html");
    for (const registration of registrations) {
      expect(registration.dispose).toHaveBeenCalled();
    }
  });
});
